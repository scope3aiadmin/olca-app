package org.openlca.app.editors.projects.results;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.function.ToDoubleBiFunction;
import java.util.stream.Collectors;

import org.eclipse.jface.viewers.LabelProvider;
import org.eclipse.jface.viewers.TableViewer;
import org.eclipse.swt.SWT;
import org.eclipse.swt.graphics.Color;
import org.eclipse.swt.graphics.Image;
import org.eclipse.swt.widgets.Composite;
import org.eclipse.ui.forms.widgets.FormToolkit;
import org.eclipse.ui.forms.widgets.Section;
import java.io.File;

import org.eclipse.swt.widgets.Button;
import org.openlca.app.M;
import org.openlca.app.components.ContributionImage;
import org.openlca.app.components.FileChooser;
import org.openlca.app.components.ResultItemSelector;
import org.openlca.app.editors.projects.ProjectResultData;
import org.openlca.app.rcp.images.Images;
import org.openlca.app.util.Actions;
import org.openlca.app.util.Colors;
import org.openlca.app.util.Controls;
import org.openlca.app.util.CostResultDescriptor;
import org.openlca.app.util.ErrorReporter;
import org.openlca.app.util.FileType;
import org.openlca.app.util.Labels;
import org.openlca.app.util.Numbers;
import org.openlca.app.util.Popup;
import org.openlca.app.util.UI;
import org.openlca.app.viewers.tables.TableClipboard;
import org.openlca.app.viewers.tables.Tables;
import org.openlca.io.xls.results.ProjectResultExport;
import org.openlca.core.matrix.index.EnviFlow;
import org.openlca.core.matrix.index.TechFlow;
import org.openlca.core.model.ProjectVariant;
import org.openlca.core.model.descriptors.ImpactDescriptor;
import org.openlca.core.model.descriptors.RootDescriptor;
import org.openlca.core.results.LcaResult;
import org.openlca.util.Strings;

import gnu.trove.map.hash.TLongObjectHashMap;

class ContributionSection extends LabelProvider implements TableSection,
	ResultItemSelector.SelectionHandler {

	private final ProjectResultData data;
	private final ProjectVariant[] variants;
	private TableViewer table;
	private ContributionImage image;
	private final TLongObjectHashMap<Color> colors;
	private final HashMap<String, Color> tagColors = new HashMap<>();
	private Section section;

	private String unit;
	private int count = 10;
	private String query;
	private double absMax;
	private double[] totals = new double[0];
	private boolean showPercentages;
	private boolean showTagGrouping;
	private boolean previousTagGrouping;
	private List<List<Contribution>> cells;
	private HashMap<Contribution, String> contributionToTag = new HashMap<>();

	private ContributionSection(ProjectResultData data) {
		this.data = data;
		this.variants = data.variants();
		this.colors = new TLongObjectHashMap<>();
	}

	static ContributionSection of(ProjectResultData data) {
		return new ContributionSection(data);
	}

	@Override
	public void renderOn(Composite body, FormToolkit tk) {
		section = UI.section(body, tk, M.ResultContributions);
		var comp = UI.sectionClient(section, tk, 1);
		UI.gridLayout(comp, 1);

		var configComp = UI.composite(comp, tk);
		UI.gridLayout(configComp, 2, 5, 0);

		// create the result selector
		var selectorComp = UI.composite(configComp, tk);
		UI.gridLayout(selectorComp, 2, 5, 0);
		var selector = ResultItemSelector.on(data.items())
			.withSelectionHandler(this)
			.create(selectorComp, tk);
		UI.filler(configComp, tk);

		// add the search text and count selector
		var searchText = UI.emptyText(configComp, tk);
		searchText.setMessage(M.SearchAProcessDots);
		UI.gridData(searchText, true, false);
		searchText.addModifyListener($ -> {
			query = searchText.getText();
			updateRows();
		});

		var spinner = UI.spinner(configComp, tk);
		spinner.setIncrement(1);
		spinner.setMinimum(1);
		spinner.setSelection(count);
		Controls.onSelect(spinner, $ -> {
			count = Math.max(1, spinner.getSelection());
			updateRows();
		});
		var percentButton = tk.createButton(configComp, "Show %", SWT.CHECK);
		percentButton.setSelection(showPercentages);
		UI.gridData(percentButton, false, false);
		Controls.onSelect(percentButton, $ -> {
			showPercentages = percentButton.getSelection();
			updateRows();
			updateSectionTitle();
		});
		var tagGroupingButton = tk.createButton(configComp, "Group by Tag", SWT.CHECK);
		tagGroupingButton.setSelection(showTagGrouping);
		UI.gridData(tagGroupingButton, false, false);
		Controls.onSelect(tagGroupingButton, $ -> {
			showTagGrouping = tagGroupingButton.getSelection();
			updateRows();
			updateSectionTitle();
		});
		var excelExportButton = tk.createButton(configComp, "", SWT.PUSH);
		excelExportButton.setImage(Images.get(FileType.EXCEL));
		excelExportButton.setToolTipText(M.ExportToExcel);
		UI.gridData(excelExportButton, false, false);
		Controls.onSelect(excelExportButton, $ -> exportToExcel());
		UI.filler(configComp, tk);

		// create the table
		var headers = new String[variants.length];
		var widths = new double[variants.length];
		var n = variants.length == 0 ? 1 : variants.length;
		for (int i = 0; i < variants.length; i++) {
			headers[i] = Strings.orEmpty(variants[i].name);
			widths[i] = 0.98 / n;
		}
		table = Tables.createViewer(comp, headers);
		image = contributionImage(table).withFullWidth(40);
		table.setLabelProvider(this);
		Tables.bindColumnWidths(table, widths);
		Actions.bind(section, TableClipboard.onCopyAll(table));
		Actions.bind(table, TableClipboard.onCopySelected(table));

		// fire the initial selection
		selector.initWithEvent();
	}

	@Override
	public Image getColumnImage(Object obj, int col) {
		if (!(obj instanceof Contribution[] row) || absMax == 0)
			return null;
		if (row.length <= col || row[col] == null)
			return null;
		var cell = row[col];
		double share = 0.1 + 0.9 * cell.amount / absMax;
		Color color;
		if (cell.isRest) {
			color = Colors.gray();
		} else if (showTagGrouping) {
			// When grouping by tag, use tag-based colors
			var tag = contributionToTag.get(cell);
			if (tag == null || tag.isEmpty()) {
				color = Colors.gray();
			} else {
				color = tagColors.get(tag);
				if (color == null) {
					// +2 to avoid red and blue currently as these
					// look very similar to the contribution colors
					color = Colors.getForChart(tagColors.size() + 2);
					tagColors.put(tag, color);
				}
			}
		} else if (cell.process == null) {
			// Handle contributions with no process
			color = Colors.gray();
		} else {
			color = colors.get(cell.process.id);
			if (color == null) {
				// +2 to avoid red and blue currently as these
				// look very similar to the contribution colors
				color = Colors.getForChart(colors.size() + 2);
				colors.put(cell.process.id, color);
			}
		}
		return image.get(share, color);
	}

	@Override
	public String getColumnText(Object obj, int col) {
		if (!(obj instanceof Contribution[] row))
			return null;
		if (row.length <= col || row[col] == null)
			return null;
		var cell = row[col];
		var result = formatValue(cell, col);
		if (cell.isRest) {
			return result + " | " + M.Others;
		}
		
		// When tag grouping is enabled, show only the tag
		if (showTagGrouping) {
			var tag = contributionToTag.get(cell);
			if (tag != null && !tag.isEmpty()) {
				return result + " | " + tag;
			}
			// If no tag, show "Untagged" or similar
			return result + " | (Untagged)";
		}
		
		// Original display logic
		var category = Labels.category(cell.process);
		var processName = Labels.name(cell.process);
		var tag = Labels.tag(cell.process);
		var tagSuffix = tag.isEmpty() ? "" : tag;
		if (category != null && !category.isEmpty()) {
			return result + " | " + tagSuffix + " | " + processName + " | " + category;
		}
		return result + " | " + tagSuffix + " | " + processName;
	}

	@Override
	public void onFlowSelected(EnviFlow flow) {
		unit = Labels.refUnit(flow);
		updateCells((result, techFlow)
			-> result.getDirectFlowOf(flow, techFlow));
	}

	@Override
	public void onImpactSelected(ImpactDescriptor impact) {
		unit = impact.referenceUnit;
		updateCells((result, techFlow)
			-> result.getDirectImpactOf( impact, techFlow));
	}

	@Override
	public void onCostsSelected(CostResultDescriptor cost) {
		unit = Labels.getReferenceCurrencyCode();
		updateCells((result, techFlow) -> cost.forAddedValue
			? -result.getDirectCostsOf(techFlow)
			: result.getDirectCostsOf(techFlow));
	}

	/**
	 * Creates for each variant a column of cells with the contribution values
	 * of that variant.
	 */
	private void updateCells(ToDoubleBiFunction<LcaResult, TechFlow> fn) {
		var cells = new ArrayList<List<Contribution>>();
		for (var variant : variants) {
			var map = new HashMap<RootDescriptor, Double>();
			var result = data.result().getResult(variant);
			for (var techFlow : result.techIndex()) {
				map.compute(techFlow.provider(), (process, value) -> {
					var v = fn.applyAsDouble(result, techFlow);
					return value != null
						? value + v
						: v;
				});
			}
			var column = map.entrySet()
				.stream()
				.map(e -> new Contribution(e.getKey(), e.getValue()))
				.collect(Collectors.toList());
			cells.add(column);
		}
		this.cells = cells;
		updateRows();
	}

	private void updateRows() {
		if (cells == null)
			return;

		contributionToTag.clear();
		// Clear tag colors when switching modes
		if (showTagGrouping != previousTagGrouping) {
			tagColors.clear();
			previousTagGrouping = showTagGrouping;
		}
		double absMax = 0;
		var totals = new double[variants.length];
		var rows = new ArrayList<Contribution[]>();

		if (showTagGrouping) {
			// Group contributions by tagSuffix
			for (int i = 0; i < variants.length; i++) {
				var variantCells = cells.get(i);
				totals[i] = variantCells.stream()
					.mapToDouble(c -> Math.abs(c.amount))
					.sum();

				// Group by tagSuffix
				var tagMap = new HashMap<String, Double>();
				for (var cell : variantCells) {
					if (cell.isRest)
						continue;
					var tag = Labels.tag(cell.process);
					var tagSuffix = tag.isEmpty() ? "" : tag;
					tagMap.merge(tagSuffix, cell.amount, Double::sum);
				}

				// Create contributions for each tag
				var tagContributions = new ArrayList<Contribution>();
				for (var entry : tagMap.entrySet()) {
					// Create a dummy process descriptor for tag-grouped contributions
					// We'll use the first process with this tag as a placeholder
					RootDescriptor tagProcess = null;
					for (var cell : variantCells) {
						if (!cell.isRest && Labels.tag(cell.process).equals(entry.getKey())) {
							tagProcess = cell.process;
							break;
						}
					}
					if (tagProcess != null || entry.getKey().isEmpty()) {
						var tagContribution = new Contribution(
							tagProcess != null ? tagProcess : null,
							entry.getValue());
						tagContributions.add(tagContribution);
						contributionToTag.put(tagContribution, entry.getKey());
					}
				}

				// Sort by amount and select top contributions
				tagContributions.sort((a, b) -> Double.compare(Math.abs(b.amount), Math.abs(a.amount)));
				var selected = tagContributions.stream()
					.limit(count)
					.collect(Collectors.toList());

				// Fill column i in the rows
				for (int j = 0; j < selected.size(); j++) {
					while (rows.size() <= j) {
						rows.add(new Contribution[variants.length]);
					}
					var cell = selected.get(j);
					rows.get(j)[i] = cell;
					absMax = Math.max(absMax, Math.abs(cell.amount));
				}
			}
		} else {
			// Original logic: show individual process contributions
			for (int i = 0; i < variants.length; i++) {
				var variantCells = cells.get(i);
				totals[i] = variantCells.stream()
					.mapToDouble(c -> Math.abs(c.amount))
					.sum();
				// select the top contributions of variant i
				var selected = Contribution.select(variantCells, count, query);

				// fill column i in the rows with the respective contributions
				for (int j = 0; j < selected.size(); j++) {
					while (rows.size() <= j) {
						rows.add(new Contribution[variants.length]);
					}
					var cell = selected.get(j);
					rows.get(j)[i] = cell;
					absMax = Math.max(absMax, Math.abs(cell.amount));
				}
			}
		}

		this.totals = totals;
		this.absMax = absMax;
		this.colors.clear();
		table.setInput(rows);
		updateSectionTitle();
	}

	private void updateSectionTitle() {
		if (section == null)
			return;
		var title = M.ResultContributions;
		if (showPercentages && totals != null && totals.length > 0) {
			var totalPercents = new StringBuilder();
			for (int i = 0; i < variants.length; i++) {
				if (i > 0)
					totalPercents.append(" / ");
				var total = totals[i];
				if (total == 0) {
					totalPercents.append("0.00%");
				} else {
					var sum = 0.0;
					if (cells != null && i < cells.size()) {
						var selected = Contribution.select(cells.get(i), count, query);
						for (var cell : selected) {
							sum += Math.abs(cell.amount);
						}
					}
					var percent = sum / total * 100.0;
					totalPercents.append(String.format("%.2f%%", percent));
				}
			}
			title += " (" + totalPercents + ")";
		}
		section.setText(title);
	}

	private String formatValue(Contribution cell, int col) {
		if (!showPercentages) {
			var result = Numbers.format(cell.amount, 2);
			if (unit != null) {
				result += " " + unit;
			}
			return result;
		}
		var total = totals != null && totals.length > col
			? totals[col]
			: 0;
		if (total == 0) {
			return String.format("%.2f%%", 0.0);
		}
		var percent = cell.amount / total * 100.0;
		return String.format("%.2f%%", percent);
	}
}
